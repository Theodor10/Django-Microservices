import datetime

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from django.http.response import JsonResponse, HttpResponse

from .serializers import DeviceSerializer, DeviceDataSerializer, AssignmentSerializer
from .models import Device, DeviceData, Assignment


class InvalidUser(Exception):
    pass


class DeviceView(viewsets.ModelViewSet):
    serializer_class = DeviceSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        if self.request.user.role == "admin":
            return Device.objects.all()
        else:
            user_devices = Assignment.objects.filter(id_user=self.request.user.id).values('id_device')
            return Device.objects.filter(id__in=user_devices)


@api_view(['GET', 'POST'])
def manage_devices(request):
    if request.method == 'GET':
        v = DeviceView.as_view({'get': 'list'})
        return v(request._request)
    elif request.method == 'POST':
        v = DeviceView.as_view({'post': 'create'})
        return v(request._request)
    return JsonResponse({'message': 'Invalid method!'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def specific_device(request, pk):
    if request.method == 'GET':
        v = DeviceView.as_view({'get': 'retrieve'})
        return v(request._request, pk=pk)
    elif request.method == 'PUT':
        v = DeviceView.as_view({'put': 'partial_update'})
        return v(request._request, pk=pk)
    elif request.method == 'DELETE':
        v = DeviceView.as_view({'delete': 'destroy'})
        return v(request._request, pk=pk)
    return JsonResponse({'message': 'Invalid method!'}, status=status.HTTP_400_BAD_REQUEST)


class DeviceDataView(viewsets.ModelViewSet):
    serializer_class = DeviceDataSerializer
    permission_classes = (IsAuthenticated,)


@api_view(['POST'])
def manage_device_data(request):
    if request.method == 'POST':
        v = DeviceDataView.as_view({'post': 'create'})
        return v(request._request)
    return JsonResponse({'message': 'Invalid method!'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def specific_device_data(request, id_device, year, month, day):

    if request.method == 'GET':
        v = DeviceDataView()
        v.check_permissions(request)
        try:
            start_date = datetime.datetime(int(year), int(month), int(day), 0, 0, 0, 0)
            end_date = datetime.datetime(int(year), int(month), int(day) + 1, 0, 0, 0, 0)
        except Exception:
            return JsonResponse({'error': 'Invalid date format!'}, status=status.HTTP_400_BAD_REQUEST)
        objects = DeviceData.objects.filter(id_device=id_device, timestamp__range=(start_date, end_date))
        serializer = DeviceDataSerializer(objects, many=True)
        return Response(serializer.data)
    return JsonResponse({'message': 'Invalid method!'}, status=status.HTTP_400_BAD_REQUEST)


class AssignmentView(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        if self.request.user.role == "admin":
            return Assignment.objects.all()
        raise InvalidUser()


@api_view(['GET', 'POST'])
def manage_assignments(request):
    if request.method == 'GET':
        v = AssignmentView.as_view({'get': 'list'})
        try:
            return v(request._request)
        except InvalidUser:
            return HttpResponse('401 Unauthorized', status=401)

    elif request.method == 'POST':
        v = AssignmentView.as_view({'post': 'create'})
        return v(request._request)
    return JsonResponse({'message': 'Invalid method!'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def specific_assignment(request, pk):
    if request.method == 'GET':
        v = AssignmentView.as_view({'get': 'retrieve'})
        return v(request._request, pk=pk)
    elif request.method == 'PUT':
        v = AssignmentView.as_view({'put': 'partial_update'})
        return v(request._request, pk=pk)
    elif request.method == 'DELETE':
        v = AssignmentView.as_view({'delete': 'destroy'})

        return v(request._request, pk=pk)
    return JsonResponse({'message': 'Invalid method!'}, status=status.HTTP_400_BAD_REQUEST)

